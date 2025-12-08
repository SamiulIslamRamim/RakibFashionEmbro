import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request { 
    userId?: string; 
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }


try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
        
        const uid = decoded as { userId: string };
        req.userId = uid.userId;
        next();

    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            // Use 401 for expired tokens
            return res.status(401).json({ error: 'Token expired' }); 
        }
        return res.status(403).json({ error: 'Invalid token' }); 
    }




    // jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    //     if (err) {
    //         return res.status(403).json({ error: 'Invalid token' });
    //     }

    //     const uid= decoded as { userId: string };
    //     req.userId = uid.userId;
    //     next();
    // });
};
