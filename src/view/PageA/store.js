import { observable } from '../../mobx-source/mobx';

// configure({
//     useProxies: "never"
// })


// var user = {
//   income: 3,
//   name: '张三'
// };
// var bankUser = observable.object(user);
// var bankUser2 = observable.box(user);

// console.log(bankUser);
// console.log(bankUser2);


// var pr1 = observable.box(2);
// console.log(pr1);
// console.log('--------华丽分割-----------')
// var pr2 = observable('ddd');
// console.log(pr2);



// class Store {
//   @observable data = 'text';
// }

// export default new Store();

var parent = {
  inProp: {
    name: 'tony',
    age: 15
  },
  job: '钢铁侠'
}
debugger
var bankUser = observable(parent);

console.log(bankUser)
console.log(bankUser.Symbol)
export default bankUser;