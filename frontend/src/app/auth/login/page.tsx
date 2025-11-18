import { ThemeLogo } from "@/_components/atoms/ThemeLogo";
import { LoginForm } from "@/_components/auth/login/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { redirectIfAuthenticated } from "@/utils/auth/auth-guard";

export default async function LoginPage() {
  await redirectIfAuthenticated();
  return (
    <div className="min-h-screen  grid grid-cols-1 lg:grid-cols-2">
      <Card
        className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 
                   bg-card rounded-none dark:bg-gradient-to-r 
                   dark:from-black dark:via-gray-900 dark:to-gray-950 text-white"
      >
        <CardHeader>
          {/* <div className="flex flex-col items-center mb-8">
            <div className="mb-4 transform hover:scale-105 transition-transform duration-200">
              <ThemeLogo className="text-center" />
            </div>
            <p className="text-primary font-medium">Messaging Platform</p>
          </div> */}
          {/* <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome Back
          </CardTitle> */}
          {/* <CardDescription className="mt-3 text-center text-sm text-muted-foreground">
            Enter your details to access your dashboard
          </CardDescription> */}
        </CardHeader>
        <LoginForm />
      </Card>
      <div
        className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 
                  dark:to-black/80 p-6 sm:p-10 flex flex-col justify-center 
                  transition-colors"
      >
        <div className="bg-white/70 dark:bg-black/60 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-semibold mb-3">VOXILITY</h3>
          <p className="text-sm text-gray-400 mb-3">
            Conversational AI Platform
          </p>
          <div className="flex text-yellow-400 mb-4">★★★★★</div>
          <p className="text-gray-300 italic mb-6">
            "Voxility has transformed how we engage with our customers. The
            AI-powered conversations are incredibly natural and have boosted our
            user satisfaction by over 40%."
          </p>

          <div className="flex items-center gap-3 mb-6">
            <img
              src="https://randomuser.me/api/portraits/women/44.jpg"
              alt="user"
              className="w-10 h-10 rounded-full border-2 border-gray-700"
            />
            <div>
              <p className="text-sm font-semibold">Sarah Chen</p>
              <p className="text-xs text-gray-400">
                Head of Customer Experience, TechFlow Solutions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center">
              <span className="text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="20"
                  viewBox="0 0 18 20"
                  fill="none"
                >
                  <path d="M17.75 20H0.25V0H17.75V20Z" />
                  <g clip-path="url(#clip0_2_153)">
                    <path
                      d="M9 2.75C9.48398 2.75 9.875 3.14102 9.875 3.625V5.375H13.1562C14.2445 5.375 15.125 6.25547 15.125 7.34375V14.7812C15.125 15.8695 14.2445 16.75 13.1562 16.75H4.84375C3.75547 16.75 2.875 15.8695 2.875 14.7812V7.34375C2.875 6.25547 3.75547 5.375 4.84375 5.375H8.125V3.625C8.125 3.14102 8.51602 2.75 9 2.75ZM5.9375 13.25C5.69688 13.25 5.5 13.4469 5.5 13.6875C5.5 13.9281 5.69688 14.125 5.9375 14.125H6.8125C7.05312 14.125 7.25 13.9281 7.25 13.6875C7.25 13.4469 7.05312 13.25 6.8125 13.25H5.9375ZM8.5625 13.25C8.32187 13.25 8.125 13.4469 8.125 13.6875C8.125 13.9281 8.32187 14.125 8.5625 14.125H9.4375C9.67813 14.125 9.875 13.9281 9.875 13.6875C9.875 13.4469 9.67813 13.25 9.4375 13.25H8.5625ZM11.1875 13.25C10.9469 13.25 10.75 13.4469 10.75 13.6875C10.75 13.9281 10.9469 14.125 11.1875 14.125H12.0625C12.3031 14.125 12.5 13.9281 12.5 13.6875C12.5 13.4469 12.3031 13.25 12.0625 13.25H11.1875ZM7.46875 9.75C7.46875 9.45992 7.35352 9.18172 7.1484 8.9766C6.94328 8.77148 6.66508 8.65625 6.375 8.65625C6.08492 8.65625 5.80672 8.77148 5.6016 8.9766C5.39648 9.18172 5.28125 9.45992 5.28125 9.75C5.28125 10.0401 5.39648 10.3183 5.6016 10.5234C5.80672 10.7285 6.08492 10.8438 6.375 10.8438C6.66508 10.8438 6.94328 10.7285 7.1484 10.5234C7.35352 10.3183 7.46875 10.0401 7.46875 9.75ZM11.625 10.8438C11.9151 10.8438 12.1933 10.7285 12.3984 10.5234C12.6035 10.3183 12.7188 10.0401 12.7188 9.75C12.7188 9.45992 12.6035 9.18172 12.3984 8.9766C12.1933 8.77148 11.9151 8.65625 11.625 8.65625C11.3349 8.65625 11.0567 8.77148 10.8516 8.9766C10.6465 9.18172 10.5312 9.45992 10.5312 9.75C10.5312 10.0401 10.6465 10.3183 10.8516 10.5234C11.0567 10.7285 11.3349 10.8438 11.625 10.8438ZM1.5625 8.875H2V14.125H1.5625C0.837891 14.125 0.25 13.5371 0.25 12.8125V10.1875C0.25 9.46289 0.837891 8.875 1.5625 8.875ZM16.4375 8.875C17.1621 8.875 17.75 9.46289 17.75 10.1875V12.8125C17.75 13.5371 17.1621 14.125 16.4375 14.125H16V8.875H16.4375Z"
                      fill="white"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_2_153">
                      <path
                        d="M0.25 2.75H17.75V16.75H0.25V2.75Z"
                        fill="white"
                      />
                    </clipPath>
                  </defs>
                </svg>
              </span>
              <p className="text-xs text-gray-400 mt-1">AI Powered</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="20"
                  viewBox="0 0 14 20"
                  fill="none"
                >
                  <path d="M14 20H0V0H14V20Z" />
                  <path d="M14 16.75H0V2.75H14V16.75Z" />
                  <path
                    d="M1.75 4.5C1.75 4.01602 1.35898 3.625 0.875 3.625C0.391016 3.625 0 4.01602 0 4.5V13.6875C0 14.8961 0.978906 15.875 2.1875 15.875H13.125C13.609 15.875 14 15.484 14 15C14 14.516 13.609 14.125 13.125 14.125H2.1875C1.94687 14.125 1.75 13.9281 1.75 13.6875V4.5ZM12.868 6.86797C13.2098 6.52617 13.2098 5.97109 12.868 5.6293C12.5262 5.2875 11.9711 5.2875 11.6293 5.6293L8.75 8.51133L7.18047 6.9418C6.83867 6.6 6.28359 6.6 5.9418 6.9418L2.8793 10.0043C2.5375 10.3461 2.5375 10.9012 2.8793 11.243C3.22109 11.5848 3.77617 11.5848 4.11797 11.243L6.5625 8.80117L8.13203 10.3707C8.47383 10.7125 9.02891 10.7125 9.3707 10.3707L12.8707 6.8707L12.868 6.86797Z"
                    fill="white"
                  />
                </svg>
              </span>
              <p className="text-xs text-gray-400 mt-1">Analytics</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="15"
                  viewBox="0 0 18 15"
                  fill="none"
                >
                  <g clip-path="url(#clip0_2_165)">
                    <path
                      d="M4.1875 0.75C4.76766 0.75 5.32406 0.980468 5.7343 1.3907C6.14453 1.80094 6.375 2.35734 6.375 2.9375C6.375 3.51766 6.14453 4.07406 5.7343 4.4843C5.32406 4.89453 4.76766 5.125 4.1875 5.125C3.60734 5.125 3.05094 4.89453 2.6407 4.4843C2.23047 4.07406 2 3.51766 2 2.9375C2 2.35734 2.23047 1.80094 2.6407 1.3907C3.05094 0.980468 3.60734 0.75 4.1875 0.75ZM14.25 0.75C14.8302 0.75 15.3866 0.980468 15.7968 1.3907C16.207 1.80094 16.4375 2.35734 16.4375 2.9375C16.4375 3.51766 16.207 4.07406 15.7968 4.4843C15.3866 4.89453 14.8302 5.125 14.25 5.125C13.6698 5.125 13.1134 4.89453 12.7032 4.4843C12.293 4.07406 12.0625 3.51766 12.0625 2.9375C12.0625 2.35734 12.293 1.80094 12.7032 1.3907C13.1134 0.980468 13.6698 0.75 14.25 0.75ZM0.25 8.91758C0.25 7.30703 1.55703 6 3.16758 6H4.33516C4.76992 6 5.18281 6.0957 5.55469 6.26523C5.51914 6.46211 5.50273 6.66719 5.50273 6.875C5.50273 7.91953 5.96211 8.85742 6.68672 9.5C6.68125 9.5 6.67578 9.5 6.66758 9.5H0.832422C0.5125 9.5 0.25 9.2375 0.25 8.91758ZM11.3324 9.5C11.327 9.5 11.3215 9.5 11.3133 9.5C12.0406 8.85742 12.4973 7.91953 12.4973 6.875C12.4973 6.66719 12.4781 6.46484 12.4453 6.26523C12.8172 6.09297 13.2301 6 13.6648 6H14.8324C16.443 6 17.75 7.30703 17.75 8.91758C17.75 9.24023 17.4875 9.5 17.1676 9.5H11.3324ZM6.375 6.875C6.375 6.17881 6.65156 5.51113 7.14384 5.01884C7.63613 4.52656 8.30381 4.25 9 4.25C9.69619 4.25 10.3639 4.52656 10.8562 5.01884C11.3484 5.51113 11.625 6.17881 11.625 6.875C11.625 7.57119 11.3484 8.23887 10.8562 8.73116C10.3639 9.22344 9.69619 9.5 9 9.5C8.30381 9.5 7.63613 9.22344 7.14384 8.73116C6.65156 8.23887 6.375 7.57119 6.375 6.875ZM3.75 14.0199C3.75 12.0074 5.38242 10.375 7.39492 10.375H10.6051C12.6176 10.375 14.25 12.0074 14.25 14.0199C14.25 14.4219 13.9246 14.75 13.5199 14.75H4.48008C4.07812 14.75 3.75 14.4246 3.75 14.0199Z"
                      fill="white"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_2_165">
                      <path
                        d="M0.25 0.75H17.75V14.75H0.25V0.75Z"
                        fill="white"
                      />
                    </clipPath>
                  </defs>
                </svg>
              </span>
              <p className="text-xs text-gray-400 mt-1">Engagement</p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-gray-400 text-sm">
          Join <span className="text-orange-400 font-semibold">10,000+</span>{" "}
          businesses already using Voxility to enhance their customer
          interactions through intelligent voice technology.
        </p>
      </div>

      {/* <div className="hidden lg:block relative bg-gradient-to-br from-primary to-secondary min-h-screen">
        <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-background/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12">
          <h2 className="text-4xl font-bold mb-6 text-center drop-shadow-lg">
            Smart Communication Platform
          </h2>
          <p className="text-xl text-center max-w-lg opacity-90 drop-shadow-md">
            Manage your conversations efficiently with our advanced messaging platform
          </p>
          <div className="absolute bottom-8 left-0 right-0 text-center text-sm opacity-75">
            Powered by AI technology
          </div>
        </div>
      </div> */}
    </div>
  );
}
