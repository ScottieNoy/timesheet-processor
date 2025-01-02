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

// Default admin credentials
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'vytmyp-7wUqcy-tajqes',
  isAdmin: true,
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const request: AuthRequest = await context.request.json();
    console.log('Auth request:', { ...request, password: '[REDACTED]' });

    // Initialize users array
    let users: User[] = [];
    try {
      const usersStr = context.env.USERS || '[]';
      console.log('Current users string:', usersStr);
      users = JSON.parse(usersStr);
      console.log('Parsed users:', users.map(u => ({ ...u, password: '[REDACTED]' })));
    } catch (error) {
      console.error('Error parsing users:', error);
      users = [];
    }

    // Always ensure default admin exists
    if (!users.some(u => u.username === DEFAULT_ADMIN.username)) {
      console.log('Adding default admin user');
      users = [...users, DEFAULT_ADMIN];
      context.env.USERS = JSON.stringify(users);
    }

    // Get session ID from cookie
    const cookies = context.request.headers.get('Cookie') || '';
    const sessionMatch = cookies.match(/sessionId=([^;]+)/);
    const sessionId = sessionMatch ? sessionMatch[1] : undefined;
    console.log('Session ID from cookie:', sessionId);

    switch (request.action) {
      case 'login': {
        console.log('Processing login request');
        if (!request.username || !request.password) {
          console.log('Missing credentials');
          return new Response(JSON.stringify({ error: 'Missing credentials' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        console.log('Looking for user:', request.username);
        const user = users.find(
          (u) => u.username === request.username && u.password === request.password
        );

        if (user) {
          console.log('User found, creating session');
          const session = createSession(user.username);
          console.log('Session created:', session.id);
          
          const response = new Response(
            JSON.stringify({ 
              success: true, 
              user: { ...user, password: undefined },
              sessionId: session.id
            }),
            {
              headers: { 
                'Content-Type': 'application/json',
                'Set-Cookie': `sessionId=${session.id}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=31536000`
              },
            }
          );
          console.log('Login successful');
          return response;
        }
        
        console.log('Invalid credentials');
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'verify': {
        console.log('Processing verify request');
        if (!sessionId) {
          console.log('No session ID provided');
          return new Response(JSON.stringify({ error: 'No session' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const session = getSession(sessionId);
        if (!session) {
          console.log('Invalid session');
          return new Response(JSON.stringify({ error: 'Invalid session' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const sessionUser = getUserFromSession(sessionId, users);
        if (!sessionUser) {
          console.log('User not found for session');
          return new Response(JSON.stringify({ error: 'User not found' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        console.log('Session verified for user:', sessionUser.username);
        return new Response(JSON.stringify({ 
          success: true,
          user: { ...sessionUser, password: undefined }
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'logout': {
        console.log('Processing logout request');
        if (sessionId) {
          deleteSession(sessionId);
          console.log('Session deleted:', sessionId);
        }
        return new Response(JSON.stringify({ success: true }), {
          headers: { 
            'Content-Type': 'application/json',
            'Set-Cookie': 'sessionId=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
          },
        });
      }

      case 'addUser': {
        console.log('Processing add user request');
        const adminUser = sessionId ? getUserFromSession(sessionId, users) : undefined;
        if (!adminUser?.isAdmin) {
          console.log('Unauthorized add user attempt');
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (!request.username || !request.password) {
          console.log('Missing user details');
          return new Response(JSON.stringify({ error: 'Missing user details' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (users.some((u) => u.username === request.username)) {
          console.log('Username already exists');
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
        console.log('User added successfully');
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'updateUser': {
        console.log('Processing update user request');
        const currentUser = sessionId ? getUserFromSession(sessionId, users) : undefined;
        if (!currentUser) {
          console.log('Unauthorized update attempt');
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (currentUser.username === DEFAULT_ADMIN.username && request.newUsername) {
          console.log('Attempt to change default admin username');
          return new Response(JSON.stringify({ error: 'Cannot change default admin username' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const userIndex = users.findIndex(u => u.username === currentUser.username);
        if (userIndex === -1) {
          console.log('User not found for update');
          return new Response(JSON.stringify({ error: 'User not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (request.newUsername) {
          if (users.some((u, i) => i !== userIndex && u.username === request.newUsername)) {
            console.log('New username already exists');
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
        console.log('User updated successfully');

        return new Response(
          JSON.stringify({
            success: true,
            user: { ...users[userIndex], password: undefined },
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    console.log('Invalid action requested:', request.action);
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
