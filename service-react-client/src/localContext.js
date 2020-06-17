import React from 'react'

const StringsContext = React.createContext()

export const StringsProvider = StringsContext.Provider
export const StringsConsumer = StringsContext.Consumer

export default StringsContext
