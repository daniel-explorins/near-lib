## Explorins near-mintbase API

This library provides a gateway to connect to your mintbase near wallet to your app to get its data and work with it.

- Acquire an API key in the `Developer` tab on [Mintbase](https://mintbase.io/developer)

### working example to connect testnet

First we create an instance to our wallet

```typescript
import { NearWallet } from '@explorins/near-lib';

    const wallet = new NearWallet(
        {
            MINTBASE_API_KEY,
            'testnet'
        }
    );
```
Now web can subscribe to wallet logged observable
``` typescript
    $logginObservable = wallet.isLogged$;
    $logginObservable.subscribe((logged:boolean) => {
        ...
    })
```
Next we must to init our wallet object
``` typescript
    await wallet.init();
```
After init if we are previously logged, we can recover the loggin state and actuate accordingly in the app
``` typescript
    $logginObservable.subscribe((logged:boolean) => {
        if(logged) console.log('Already logged in');
    })
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


Library errors are returned to the application using numerical codes that allow us to customize our response to the user in each case.

```typescript
    CONNECT: {
        USER_NOT_FOUND: '0101',
        MINTBASE_LOGIN: '0102',
        USUPPORTED_NETWORK: '0103',
        MINTBASE_NOT_CONNECTED: '0104',
        MINTBASE_ERROR: '0105'
    },
    DISCONNECT: {
        MINTBASE_ERROR: '0201',
        MINTBASE_NOT_CONNECTED: '0202',
        ALREADY_DISCONNECTED: '0203'
    },
    TRANSFER_TOKEN: {
        ACCOUNT_NOT_FOUND: '0301',
        CONTRACT_NOT_FOUND: '0302',
        TRANSACTION_FAILS: '0303',
        MINTBASE_NOT_CONNECTED: '0304'
    },
    CONTRACT: {
        USER_NOT_FOUND: '0401',
        MINTBASE_NOT_CONNECTED: '0402',
        MINTBASE_ERROR: '0403',
        CONTRACT_NAME_NOT_FOUND: '0404',
        NEAR_ERROR: '0405'
    },
    GET_TOKEN: {
        MINTBASE_NOT_CONNECTED: '0501',
        TIMEOUT_ERROR: '0502'
    },
    MAKE_OFFER: {
        USER_NOT_FOUND: '0601',
        TOKEN_NOT_FOUND: '0602',
        STORE_NOT_FOUND: '0603',
        MINTBASE_NOT_CONNECTED: '0604',
        MINTBASE_ERROR: '0605'
    },
    FETCH_STORE: {
        MINTBASE_NOT_CONNECTED: '0701',
        MINTBASE_ERROR: '0702',
        GRAPHQL_ERROR: '0703'
    },
    FETCH_THINGS: {
        MINTBASE_NOT_CONNECTED: '0801',
        MINTBASE_ERROR: '0802'
    },
    GET_MINTERS: {
        MINTBASE_NOT_CONNECTED: '0901',
        MINTBASE_ERROR: '0902',
        CONTRACT_ERROR: '0903'
    },
    FETCH_MARKETPLACE: {
        MINTBASE_NOT_CONNECTED: '1001',
        MINTBASE_ERROR: '1002'
    }
```