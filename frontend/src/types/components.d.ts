// Type declarations for JavaScript components
import * as React from 'react';

declare module './components/ProduceList' {
  const ProduceList: React.ComponentType<any>;
  export default ProduceList;
}

declare module './components/Register' {
  const Register: React.ComponentType<any>;
  export default Register;
}

declare module './components/Login' {
  const Login: React.ComponentType<any>;
  export default Login;
}

declare module './components/CreateListingForm' {
  const CreateListingForm: React.ComponentType<any>;
  export default CreateListingForm;
}

declare module './components/MyListings' {
  const MyListings: React.ComponentType<any>;
  export default MyListings;
}

declare module './components/EditListingForm' {
  const EditListingForm: React.ComponentType<any>;
  export default EditListingForm;
}

declare module './components/MessageCenter' {
  const MessageCenter: React.ComponentType<any>;
  export default MessageCenter;
}

declare module './components/Inbox' {
  const Inbox: React.ComponentType<any>;
  export default Inbox;
}

declare module './components/ListingDetails' {
  const ListingDetails: React.ComponentType<any>;
  export default ListingDetails;
}

declare module './components/DarkModeToggle' {
  interface DarkModeToggleProps {
    darkMode: boolean;
    toggleDarkMode: () => void;
  }
  const DarkModeToggle: React.ComponentType<DarkModeToggleProps>;
  export default DarkModeToggle;
}
