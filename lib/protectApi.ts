import { auth } from '@clerk/nextjs/server';

function hasUserId(obj: any): obj is { userId: string } {
  return obj && typeof obj.userId === 'string';
}

export function protectApi(
  handler: (req: any, res: any, userId: string) => void | Promise<void>
) {
  return async (req: any, res: any) => {
    try {
      const authResult = await auth();

      if (!hasUserId(authResult)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { userId } = authResult;

      // Ensure secret is a string
      const secret = Array.isArray(req.headers['x-api-secret'])
        ? req.headers['x-api-secret'][0]
        : req.headers['x-api-secret'] || '';

      if (secret !== process.env.API_SECRET) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Call the handler
      await handler(req, res, userId);
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
}
