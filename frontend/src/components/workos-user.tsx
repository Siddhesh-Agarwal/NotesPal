import { useAuth } from "@workos-inc/authkit-react";
import { LogIn, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

export default function SignInButton() {
  const { user, isLoading, signIn, signOut } = useAuth();

  if (user) {
    return (
      <div className="flex flex-col gap-3">
        <Avatar>
          <AvatarImage src={user.profilePictureUrl || ""} />
          <AvatarFallback>
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <Button size={"icon"} onClick={() => signOut()}>
          <LogOut />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => {
        signIn();
      }}
      size={"icon"}
      disabled={isLoading}
    >
      <LogIn />
    </Button>
  );
}
