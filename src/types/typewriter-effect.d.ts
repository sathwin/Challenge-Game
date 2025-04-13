declare module 'typewriter-effect' {
  interface TypewriterOptions {
    strings?: string[];
    autoStart?: boolean;
    loop?: boolean;
    delay?: number;
    deleteSpeed?: number;
    pauseFor?: number;
    cursor?: string;
    devMode?: boolean;
    wrapperClassName?: string;
    cursorClassName?: string;
  }

  interface TypewriterState {
    elements: {
      container: HTMLElement;
      wrapper: HTMLElement;
    };
  }

  interface Typewriter {
    typeString(string: string): Typewriter;
    pauseFor(milliseconds: number): Typewriter;
    deleteAll(speed?: number): Typewriter;
    deleteChars(amount: number): Typewriter;
    callFunction(cb: () => void, thisArg?: object): Typewriter;
    start(): TypewriterState;
  }

  interface TypewriterProps {
    onInit?: (typewriter: Typewriter) => void;
    options?: TypewriterOptions;
    component?: string | React.ComponentType;
  }

  const Typewriter: React.FC<TypewriterProps>;
  
  export default Typewriter;
} 