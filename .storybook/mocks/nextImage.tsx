import * as React from 'react'

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string
  alt: string
}

const NextImage = (props: ImageProps) => {
  // Simple passthrough for Storybook
  // eslint-disable-next-line jsx-a11y/alt-text
  return <img {...props} />
}

export default NextImage
