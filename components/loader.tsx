import { LoaderCircle } from 'lucide-react';

export const Loader = () => {
  return (
    <div className='flex justify-center items-center w-full h-screen fixed bottom-0 right-0' 
        style={{background: "rgba(0, 0, 0, 0.3)", zIndex: 100000}}
    >
        <LoaderCircle
          className='h-24 w-24 text-blue-600 animate-spin'
        />
    </div>
  );
};

export default Loader;