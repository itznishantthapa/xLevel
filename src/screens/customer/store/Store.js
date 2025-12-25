import React from 'react'
import Product from './Product'
import Subscription from './Subscription'

// Toggle this flag to switch between Product and Subscription views
// TODO: Replace with actual API/config value
const is_subscription = true

const Store = () => {
  if (is_subscription) {
    return <Subscription />
  }

  return <Product />
}

export default Store