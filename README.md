## Explorins near-mintbase API

This library provides a gateway to connect to your mintbase near wallet.

- Acquire an API key in the `Developer` tab on [Mintbase](https://mintbase.io/developer)


```typescript
import { NearWallet } from '@explorins/near-lib';

    const wallet = new NearWallet(
      MINTBASE_API_KEY
    );

    // Connect to your near wallet
    await wallet.mintbaseLogins();

    // Retrieve the basic information
    const walletDetails = await this.wallet.getDetails();

    (...)
    
```