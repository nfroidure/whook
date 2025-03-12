export type WhookHandlerWrapper<T> = (handler: T) => Promise<T>;
