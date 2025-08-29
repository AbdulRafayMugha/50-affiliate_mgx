import { Response } from 'express';
export declare const getDashboard: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const generateReferralLink: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getReferralLinks: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const sendEmailInvite: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getEmailInvites: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getReferralTree: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getCommissions: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const recordLinkClick: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
