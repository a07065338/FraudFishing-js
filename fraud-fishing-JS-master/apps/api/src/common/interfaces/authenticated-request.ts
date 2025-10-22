import { UserProfile } from "../../auth/tokens.service";
import { Request } from "express";


export interface AuthenticatedRequest extends Request {
    user: {
        profile: UserProfile;
    };
}