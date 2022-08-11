import retry from 'retry'

export async function retryFetch(
  url: string,
  fetchOptions?: RequestInit,
  retryOptions?: retry.OperationOptions
) {

  /* Example of retry options

  const operation = retry.operation({
    retries: 5,
    factor: 3,
    minTimeout: 1 * 1000,
    maxTimeout: 60 * 1000,
    randomize: true,
  });
  
  */
  const operation = retry.operation(retryOptions)

  return new Promise<Response>((resolve, reject) => {
    operation.attempt(() => {
      fetch(url, fetchOptions)
        .then(async (data) => {
          resolve(data)
        })
        .catch((error) => {
          if (operation.retry(error)) reject(error)
        })
    })
  })
}
