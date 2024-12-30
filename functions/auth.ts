import { createSession, deleteSession, getUserFromSession, getSession } from './session';

export interface Env {
  USERS?: string;
  ADMIN_PASSWORD?: string;
}

interface User {
  username: string;
  password: string;
  isAdmin?: boolean;
}

interface AuthRequest {
  action: 'login' | 'logout' | 'addUser' | 'updateUser' | 'verify';
  username?: string;
  password?: string;
  newUsername?: string;
  newPassword?: string;
  adminPassword?: string;
  isFirstTimeSetup?: boolean;
  sessionId?: string;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const request: AuthRequest = await context.request.json();
    const usersStr = context.env.USERS || '[]';
    let users: User[] = JSON.parse(usersStr);
    const adminPassword = context.env.ADMIN_PASSWORD || 'admin-password';

    // Get session ID from cookie
    const cookies = context.request.headers.get('Cookie') || '';
    const sessionMatch = cookies.match(/sessionId=([^;]+)/);
    const sessionId = sessionMatch ? sessionMatch[1] : undefined;

    console.log('Action:', request.action);
    console.log('Session ID:', sessionId);

    switch (request.action) {
      case 'verify':
        if (!sessionId) {
          return new Response(JSON.stringify({ error: 'No session' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const session = getSession(sessionId);
        if (!session) {
          return new Response(JSON.stringify({ error: 'Invalid session' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const sessionUser = getUserFromSession(sessionId, users);
        if (!sessionUser) {
          return new Response(JSON.stringify({ error: 'User not found' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ 
          success: true,
          user: { ...sessionUser, password: undefined }
        }), {
          headers: { 'Content-Type': 'application/json' },
        });

      case 'login':
        if (!request.username || !request.password) {
          return new Response(JSON.stringify({ error: 'Missing credentials' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const user = users.find(
          (u) => u.username === request.username && u.password === request.password
        );

        if (user) {
          const session = createSession(user.username);
          return new Response(
            JSON.stringify({ 
              success: true, 
              user: { ...user, password: undefined },
              sessionId: session.id
            }),
            {
              headers: { 
                'Content-Type': 'application/json',
                'Set-Cookie': `sessionId=${session.id}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
              },
            }
          );
        }
        
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });

      case 'addUser':
        // Special case for first-time setup
        if (request.isFirstTimeSetup) {
          if (users.length > 0) {
            return new Response(JSON.stringify({ error: 'Setup already completed' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          if (!request.adminPassword || request.adminPassword !== adminPassword) {
            return new Response(JSON.stringify({ error: 'Invalid setup password' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          users.push({
            username: request.username!,
            password: request.password!,
            isAdmin: true,
          });
          
          context.env.USERS = JSON.stringify(users);
          
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Check session for normal user addition
        const adminUser = sessionId ? getUserFromSession(sessionId, users) : undefined;
        if (!adminUser?.isAdmin) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (!request.username || !request.password) {
          return new Response(JSON.stringify({ error: 'Missing user details' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (users.some((u) => u.username === request.username)) {
          return new Response(JSON.stringify({ error: 'Username already exists' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        users.push({
          username: request.username,
          password: request.password,
          isAdmin: false,
        });
        
        context.env.USERS = JSON.stringify(users);
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });

      case 'updateUser':
        const currentUser = sessionId ? getUserFromSession(sessionId, users) : undefined;
        if (!currentUser) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const userIndex = users.findIndex(u => u.username === currentUser.username);
        if (userIndex === -1) {
          return new Response(JSON.stringify({ error: 'User not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (request.newUsername) {
          if (users.some((u, i) => i !== userIndex && u.username === request.newUsername)) {
            return new Response(JSON.stringify({ error: 'Username already exists' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          users[userIndex].username = request.newUsername;
        }

        if (request.newPassword) {
          users[userIndex].password = request.newPassword;
        }

        context.env.USERS = JSON.stringify(users);

        return new Response(
          JSON.stringify({
            success: true,
            user: { ...users[userIndex], password: undefined },
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

      case 'logout':
        if (sessionId) {
          deleteSession(sessionId);
        }
        return new Response(JSON.stringify({ success: true }), {
          headers: { 
            'Content-Type': 'application/json',
            'Set-Cookie': 'sessionId=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
          },
        });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
