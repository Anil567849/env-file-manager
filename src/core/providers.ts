export const PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    dashboard: "https://platform.openai.com/api-keys",
    docs: "https://platform.openai.com/docs"
  },
  {
    id: "stripe",
    name: "Stripe",
    dashboard: "https://dashboard.stripe.com/apikeys",
    docs: "https://docs.stripe.com/keys"
  },
  {
    id: "aws",
    name: "AWS",
    dashboard: "https://console.aws.amazon.com/iam/home#/security_credentials",
    docs: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html"
  },
  {
    id: "supabase",
    name: "Supabase",
    dashboard: "https://supabase.com/dashboard",
    docs: "https://supabase.com/docs"
  },
  {
    id: "cloudinary",
    name: "Cloudinary",
    dashboard: "https://console.cloudinary.com/settings/api-keys",
    docs: "https://cloudinary.com/documentation"
  },
  {
    id: "resend",
    name: "Resend",
    dashboard: "https://resend.com/api-keys",
    docs: "https://resend.com/docs"
  },
  {
    id: "vercel",
    name: "Vercel",
    dashboard: "https://vercel.com/account/tokens",
    docs: "https://vercel.com/docs"
  }
];

export function getProvider(name) {
  if (!name) return undefined;
  return PROVIDERS.find((provider) => provider.name.toLowerCase() === name.toLowerCase());
}
