
import { signIn, signOut, signUp } from "@/auth/services"
import { assignPermissions, createPermision, getPermissions } from "@/auth/services/permissions"
import { createRole, getRoles } from "@/auth/services/roles"
import { ControlBuilder } from "@/core/middlewares/controlBuilder"
import { Router } from "express"
import { assignPermissionSchema, nameSchema, signInSchema, signUpSchema } from "./schema"

export const authRouter = Router()

authRouter.post(
    "/sign-up",
    ControlBuilder.builder()
    .setHandler(signUp.handle)
    .setValidator(signUpSchema)
    .handle()
)

authRouter.post(
    "/sign-in",
    ControlBuilder.builder()
    .setValidator(signInSchema)
    .setHandler(signIn.handle)
    .handle()
)

authRouter.post(
    "/sign-out",
    ControlBuilder.builder()
    .setHandler(signOut.handle)
    .isPrivate()
    .handle()
)

authRouter
  .route("/roles")
  .post(
    ControlBuilder.builder()
      .setHandler(createRole.handle)
      .setValidator(nameSchema)
      .isPrivate()
      .only("ADMIN")
      .handle(),
  )
  .get(
    ControlBuilder.builder()
      .setHandler(getRoles.handle)
      .isPrivate()
      .only("ADMIN")
      .handle(),
  )

authRouter
  .route("/permissions")
  .post(
    ControlBuilder.builder()
      .setHandler(createPermision.handle)
      .setValidator(nameSchema)
      .isPrivate()
      .only("DEVELOPER")
      .handle(),
  )
  .get(
    ControlBuilder.builder()
      .setHandler(getPermissions.handle)
      .handle(),
  )

authRouter.post(
  "/permissions/assign",
  ControlBuilder.builder()
  .setHandler(assignPermissions.handle)
  .setValidator(assignPermissionSchema)
  .isPrivate()
  .only("ADMIN")
  .handle(),

)
