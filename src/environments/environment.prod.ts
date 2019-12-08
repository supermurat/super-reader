/** configuration values of production environment */
export const environment = {
    production: true,
    protocol: 'https://',
    host: 'supermurat.com',
    defaultData: {
        defaultTitle: '',
        defaultDescription: '',
        'twitter:site': undefined,
        'twitter:creator': undefined,
        'fb:app_id': undefined,
        'fb:admins': undefined
    },
    Angulartics2: {},
    firebase: {
        apiKey: 'AIzaSyCMhFZBQm0sDSs-duP9zoZPJmv6cN-3wbg',
        authDomain: 'super-reader.firebaseapp.com',
        databaseURL: 'https://super-reader.firebaseio.com',
        projectId: 'super-reader',
        storageBucket: 'super-reader.appspot.com',
        messagingSenderId: '940887124494',
        appId: '1:940887124494:web:e6bd307affecb899a8ea5f',
        measurementId: 'G-7E5DNGGHWL'
    }
};
