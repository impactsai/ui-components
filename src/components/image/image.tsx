import './image.css'
import '../../index.css'

import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import React from 'react'

import { getSizeStyles } from '../helper'
import type { ImageFormat } from '../types'

export default function Image(props: ImageFormat) {
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string>('')

  function handleImageError(): void {
    setErrorMessage('Image failed to load')
    setIsLoading(false)
  }

  if (errorMessage.length > 0) {
    return <Typography variant="body2">{errorMessage}</Typography>
  }

  return (
    <figure>
      {isLoading && <CircularProgress data-cy="spinner" />}
      <img
        {...getSizeStyles(props.width, props.height)}
        src={props.src}
        alt={props.alt}
        onError={handleImageError}
        onLoad={() => {
          setIsLoading(false)
        }}
      />
      {props.description && (
        <figcaption>
          <Typography variant="body2">{props.description}</Typography>
        </figcaption>
      )}
    </figure>
  )
}

Image.defaultProps = {
  alt: 'An image is displayed',
}
