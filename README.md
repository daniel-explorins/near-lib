## Explorins near-mintbase API

This library provides a gateway to connect to your mintbase near wallet to your app to get its data and work with it.

- Acquire an API key in the `Developer` tab on [Mintbase](https://mintbase.io/developer)

### working example to connect testnet

First we create an instance to our wallet

```typescript
import { NearWallet } from '@explorins/near-lib';

    const wallet = new NearWallet(
      MINTBASE_API_KEY,
      'mintbase_testnet'
    );
```

If you are not connected to your wallet you must link the login button to the following action 

```typescript
    // Connect to your mintbase near wallet
    await wallet.connect();

    (...)
    
```
This action will redirect you to your wallet login on the near page
- When we return to our app, we will already be connected to mintbase and we will be able to use its methods
```typescript

    // Connect to your mintbase near wallet
    await wallet.mintbaseLogin();

    // Retrieve the basic information
    const walletDetails = await wallet.getDetails();
    const token = await wallet.getTokenFromCurrentWallet();

    (...)
    
```

The mintbaseLogin function establishes the connection with our mintbase wallet once we have done login in near.
- mintbaseLogin throws us an error in case we are not logged in near , in that case we must capture the error to redirect our users to the login

```typescript
    try {
      // Si no está logeado lanzara error y no seguirá
      await this.wallet.mintbaseLogin();
    } catch (error) {
      console.log(' *** not logged, press login button')
    }

```

The wallet object that we have created provides us with an observable that returns information about the login status.

```typescript
const loggedObservable = wallet.isLogged$;

loggedObservable.subscribe((status: boolean) => {
  console.log('Logged status change: ', status);
})
```