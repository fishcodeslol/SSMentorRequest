import type { MDXComponents } from 'mdx/types'
 
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h3: ({ children }) => (
      <h3 style={{ margin: '0.8rem'}}>{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 style={{ fontSize: '1.17em'}}>{children}</h4>
    ),
    
    ...components,
  }
}