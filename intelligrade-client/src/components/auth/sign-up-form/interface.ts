import { z } from "zod";
import { signUpSchema } from "./helpers";

export type SignUpFormData = z.infer<typeof signUpSchema>;

export interface SignUpFormProps {
    initialData?: Partial<SignUpFormData>;
    onSubmit?: (data: SignUpFormData) => Promise<void>;
} 