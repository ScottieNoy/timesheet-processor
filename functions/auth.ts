export interface Env {
  APP_PASSWORD?: string;
}

export const onRequestPost = async (context: { request: Request, env: Env }) => {
  try {
    const { password } = await context.request.json();
    
    // Get the password from environment variable
    const correctPassword = context.env.APP_PASSWORD || 'default-secure-password';

    if (password === correctPassword) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false }), {
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
