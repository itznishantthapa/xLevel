import React from 'react'
import Product from './Product'
import Subscription from './Subscription'
import { useUtils } from '../../../queries/useUtils'

const Store = () => {
  const { data: utils = [] } = useUtils()
  const isIOSActive = !!utils?.is_ios_active

  if (isIOSActive) {
    return <Subscription />
  }

  return <Product />
}

export default Store