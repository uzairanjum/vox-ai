import { LoaderCircle, LucideProps } from "lucide-react";

import { cn } from "@/lib/utils";

export interface IProps extends LucideProps {
  className?: string;
}

export const LoadingIcon = ({ className, ...props }: IProps) => {
  return (
      <LoaderCircle
        className={cn("animate-spin mx-auto", className)}
        {...props}
      />
  );
};
