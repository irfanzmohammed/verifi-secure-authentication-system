
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json(
      {
        success: false,
        message: "Unauthorized. Please log in.",
      },
      { status: 401 }
    );
  }

  return Response.json({
    success: true,
    message: "Session is valid.",
    user: {
      id: user._id.toString(),
      email: user.email,
      surname: user.surname,
      dateOfBirth: user.dateOfBirth,
    },
  });
}
