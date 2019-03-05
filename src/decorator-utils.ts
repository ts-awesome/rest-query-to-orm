import 'reflect-metadata';

export class DecoratorUtils {
  public static D(decorators: any, target: any, key?: any, desc?: any): any {
    var c = arguments.length,
      r = c < 3 ? target : desc === null ? (desc = Object.getOwnPropertyDescriptor(target, key)) : desc,
      d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  }

  public static setMeta(key: any, value: any): any {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
      return Reflect.metadata(key, value);
    }
    throw new Error('Not supported Error');
  }

  public static decorateParam(paramIndex: number, decorator: any): Function {
    return (target: any, key: any) => { decorator(target, key, paramIndex); }
  }
}