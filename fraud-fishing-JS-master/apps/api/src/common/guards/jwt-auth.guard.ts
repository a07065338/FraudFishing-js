import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { TokenService } from "src/auth/tokens.service";
import { AuthenticatedRequest } from "../interfaces/authenticated-request";

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly tokenService: TokenService) {}
    async canActivate(ctx: ExecutionContext): Promise<boolean>{
        const request = ctx.switchToHttp().getRequest<Request>();
        const auth = request.headers.authorization ?? "";
        const [schema, token] = auth.split(" ");
        if (schema!="Bearer" || !token)
            throw new UnauthorizedException("Acceso denegado - Token no proporcionado");
        try {
            const payload = await this.tokenService.verifyAccess(token);
            (request as AuthenticatedRequest).user={
                profile : payload.profile,
            }
            return true;
        } catch {
            throw new UnauthorizedException("Acceso denegado - Token inválido");
        }
    }
}