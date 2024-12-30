export interface Env {
  USERS?: string; // JSON string of users
  ADMIN_PASSWORD?: string;
}

interface User {
  username: string;
  password: string;
  isAdmin?: boolean;
}

interface AuthRequest {
  action: 'login' | 'logout' | 'addUser' | 'updateUser';
  username?: string;
  password?: string;
  newUsername?: string;
  newPassword?: string;
  adminPassword?: string;
  isFirstTimeSetup?: boolean;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const request: AuthRequest = await context.request.json();
    const usersStr = context.env.USERS || '[]';
    let users: User[] = JSON.parse(usersStr);
    const adminPassword = context.env.ADMIN_PASSWORD || 'admin-password';

    // Debug logging
    console.log('Action:', request.action);
    console.log('Is first time setup:', request.isFirstTimeSetup);
    console.log('Admin password exists:', !!context.env.ADMIN_PASSWORD);
    
    switch (request.action) {
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
          return new Response(
            JSON.stringify({ success: true, user: { ...user, password: undefined } }),
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
        break;

      case 'addUser':
        // Special case for first-time setup
        if (request.isFirstTimeSetup) {
          if (users.length > 0) {
            return new Response(JSON.stringify({ error: 'Setup already completed' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          // Debug logging
          console.log('Setup password check:', {
            provided: request.adminPassword,
            expected: adminPassword,
            matches: request.adminPassword === adminPassword
          });

          if (!request.adminPassword || request.adminPassword !== adminPassword) {
            return new Response(JSON.stringify({ 
              error: 'Invalid setup password',
              debug: {
                hasAdminPassword: !!context.env.ADMIN_PASSWORD,
                providedPassword: !!request.adminPassword
              }
            }), {
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

        // Normal user addition
        if (!request.adminPassword || request.adminPassword !== adminPassword) {
          return new Response(JSON.stringify({ error: 'Invalid admin password' }), {
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
        if (!request.username || !request.password) {
          return new Response(JSON.stringify({ error: 'Missing credentials' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const userIndex = users.findIndex(
          (u) => u.username === request.username && u.password === request.password
        );

        if (userIndex === -1) {
          return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            status: 401,
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
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
