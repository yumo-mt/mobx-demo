import { configure,makeAutoObservable,observable } from '../../mobx-source/mobx';

// configure({
//   enforceActions: 'always',
// })
// class Store{
//   constructor() {
//     // !!! 必写的
//     makeAutoObservable(this)
//   }
//   job="前端"
// }

// export default Store;

var parent = {
  inProp: {
    name: 'tony',
    age: 15
  },
  job: '钢铁侠'
}
debugger
var bankUser = observable(parent);

export default bankUser;