import { tokenService, type TokenService } from "@/auth/helpers/token"
import type { SignInPayload } from "@/auth/interfaces"
import { Role } from "@/auth/model"
import { HttpStatus, IAuthRole, UnAuthorizedError, compareHashedData, logger, type Context } from "@/core"
import { AppMessages } from "@/core/common"
import { User } from "@/users/model"

class SignIn {
    constructor(private readonly dbUser: typeof User, private readonly tokenService: TokenService) {}

    /**
     * Handles user login, performs necessary validations, and generates tokens for authentication.
     *
     * @param {Context<SignInPayload>} params - The input parameters for user login.
     * @returns {Promise<any>} The API response containing authentication tokens and user data.
     * @throws {UnAuthorizedError} Thrown if login credentials are invalid or user email is not verified.
     */

    handle = async ({ input }: Context<SignInPayload>) => {
        const { email, password } = input

        const user = await this.dbUser.findOne({
            where: { email },
            include: [Role],
        })

        if (!user) throw new UnAuthorizedError(AppMessages.FAILURE.INVALID_CREDENTIALS)

        const isPasswordValid = await compareHashedData(password, user.password)

        if (!isPasswordValid) throw new UnAuthorizedError(AppMessages.FAILURE.INVALID_CREDENTIALS)

        const roles = user.roles?.map((role) => role.name as IAuthRole) ?? []

        const [generatedAccessToken, generatedRefreshToken] = await this.tokenService.getTokens({
            id: user.id,
            email: user.email,
            roles,
        })

        await this.dbUser.update({ refreshToken: generatedRefreshToken, refreshTokenExp: new Date() }, { where: { id: user.id } })

        logger.info("Logged In Successfully")

        const { password: dbPassword, refreshToken, refreshTokenExp, ...responsePayload } = user.dataValues

        return {
            code: HttpStatus.OK,
            message: AppMessages.SUCCESS.LOGIN,
            data: responsePayload,
            headers: {
                "Set-Cookie": [
                    `accessToken=${generatedAccessToken}; Path=/; HttpOnly; maxAge=900000; SameSite=strict`,
                    `refreshToken=${generatedRefreshToken}; Path=/; HttpOnly; SameSite=strict`,
                ],
            },
        }
    }
}

export const signIn = new SignIn(User, tokenService)
