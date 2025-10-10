// Minimal mocks for Next.js App Router hooks in Storybook
export const usePathname = () => '/mobile'
export const useSearchParams = () => new URLSearchParams()
export const useRouter = () => ({
  push: (_: string) => {},
  replace: (_: string) => {},
  prefetch: async (_: string) => {},
})
