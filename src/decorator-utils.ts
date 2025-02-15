/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import 'reflect-metadata';

export function D(decorators: any, target: any, key?: any, desc?: any): any {
  const c = arguments.length;
  let r = c < 3 ? target : desc === null ? (desc = Object.getOwnPropertyDescriptor(target, key)) : desc;
  let d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") {
    r = Reflect.decorate(decorators, target, key, desc);
  } else {
    for (let i = decorators.length - 1; i >= 0; i--) {
      if ((d = decorators[i])) {
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      }
    }
  }
  if (c > 3 && r) {
    Object.defineProperty(target, key, r);
  }
  return r;
}

export function setMeta(key: any, value: any): any {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
    return Reflect.metadata(key, value);
  }
  throw new Error('Not supported Error');
}

export function decorateParam(paramIndex: number, decorator: any): ParameterDecorator {
  return (target: any, key: any) => { decorator(target, key, paramIndex); }
}
