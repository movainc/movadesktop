import { bindWorkspace } from "./store";
import { useSession, type Account } from "./session";

// A local-only account for development and the screenshot script. It is never offered in release builds.
export const TEST_ACCOUNT: Account = { id: "test-user", provider: "test", name: "Alex Rivera", email: "alex@test.mova.app" };

export async function signInTestAccount() {
  useSession.getState().setAccount(TEST_ACCOUNT);
  useSession.getState().setSync("off");
  await bindWorkspace(TEST_ACCOUNT.id);
}
