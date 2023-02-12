import { BehaviorSubject, Observable, shareReplay } from "rxjs";


export class Octoprint {
    /** Internal subject that stores login state */
  private _isLogged$ = new BehaviorSubject(false);

  /** External public observable to login state */
  public isLogged$ = this._isLogged$.asObservable().pipe(shareReplay());

  // For future implementatios that retrieves an obserbable api response
  public data$: Observable<any>;

  public constructor() {
    this.data$ = new Observable(observer => {
      fetch('http://server.com')
        .then(response => response.json()) // or text() or blob() etc.
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(err => observer.error(err));
    });
  }

  public async connect() {
    const options = {
      method: 'POST',
      body: JSON.stringify( {"passive": true} )  ,
      headers: {
        "Content-Type": "application/json",
        'X-Api-Key': '68743698937C46BA944BB892AA19D031'
      }
  };

    try {
      const response = await fetch('http://localhost:5001/api/login',options);
      const data = await response.json();
      console.log('Octo data: ', data);
    } catch (error) {
      console.log('Error: ', error);
      throw new Error('Error in octoprint call: ');
    }
  }

  public async slicing() {

    const options1 = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        'X-Api-Key': '68743698937C46BA944BB892AA19D031',
        body: JSON.stringify({
          "displayName": "Just a test",
          "description": "This is just a test to show how to create a curalegacy profile with a different layer height and skirt count",
          "data": {
            "layer_height": 0.2,
            "skirt_line_count": 3
          }
        })
      }
  };

    try {
      const response1 = await fetch('http://localhost:5001/api/slicing/curalegacy/profiles/my_test', options1);
      const data = await response1.json();
      console.log('Octo data 1: ', data);
    } catch (error) {
      console.log('Error: ', error);
      throw new Error('Error in octoprint call: ');
    }

    const options = {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        'X-Api-Key': '68743698937C46BA944BB892AA19D031'
      }
  };

    try {
      const response = await fetch('http://localhost:5001/api/slicing',options);
      const data = await response.json();
      console.log('Octo data 2: ', data);
    } catch (error) {
      console.log('Error: ', error);
      throw new Error('Error in octoprint call: ');
    }
  }

  async sliceFile(file: any, profile: any) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("profile", profile);
  
    const response = await fetch(`http://your_octoprint_host/api/slicing/curalegacy`, {
      method: "POST",
      headers: {
        "X-Api-Key": '68743698937C46BA944BB892AA19D031'
      },
      body: formData
    });
  
    if (!response.ok) {
      throw new Error(`Error slicing file: ${response.statusText}`);
    }
  
    const json = await response.json();
    console.log(json);
  }

  
}