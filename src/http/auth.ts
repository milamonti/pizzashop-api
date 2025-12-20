import cookie from "@elysiajs/cookie";
import Elysia, { t, type Static } from "elysia";
import { env } from "../env";
import jwt from "@elysiajs/jwt";
import UnauthorizedError from "./errors/unauthorized-error";

const tokenPayload = t.Object({
  sub: t.String(),
  restaurantId: t.Optional(t.String()),
});

export const auth = new Elysia()
  .error({ UNAUTHORIZED: UnauthorizedError })
  .onError(({ error, code, set }) => {
    switch(code){
      case "UNAUTHORIZED":
        set.status = 401;
        return { code, message: error.message }
    }
  })
  .use(
    jwt({
      secret: env.JWT_SECRET_KEY,
      schema: tokenPayload,
    })
  )
  .use(cookie())
  .derive({ as: "scoped" }, ({ jwt, set, removeCookie, cookie }) => {
    return {
      signUser: async (payload: Static<typeof tokenPayload>) => {
        const token = await jwt.sign(payload);

        set.cookie = {
          auth: {
            maxAge: 60 * 60 * 24 * 7, // 7 days
            value: token,
            httpOnly: true,
            path: "/"
          }
        }
      },

      signOut: async () => removeCookie("auth"),

      getCurrentUser: async () => {
        const payload = await jwt.verify(cookie.auth?.value as string | undefined);

        if(!payload){
          throw new UnauthorizedError();
        }

        return {
          userId: payload.sub,
          restaurantId: payload.restaurantId
        }
      }
    };
  });