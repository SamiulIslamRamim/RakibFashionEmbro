import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "#utils/db.ts";


export interface AuthenticatedRequest extends Request { 
    userId?: string; 
    userRole?: string;
}


export const authenticateJWT = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        
        // 2. Database Security Check: Check if user exists and is ACTIVE
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, isActive: true } // Only fetch what we need
        });

        // 3. Handle cases where user is deleted, suspended, or inactive
        if (!user) {
            return res.status(404).json({ error: 'User no longer exists' });
        }

        if (user.isActive !== 'ACTIVE') {
            const message = user.isActive === 'SUSPENDED' 
                ? 'Your account has been suspended. Contact support.' 
                : 'Account is inactive. Please reactivate your account.';
            
            return res.status(403).json({ error: message });
        }

        // 4. Attach data to request object for use in controllers
        req.userId = user.id;
        req.userRole = user.role || undefined;

        next();

    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' }); 
        }
        return res.status(403).json({ error: 'Invalid token' }); 
    }
};
