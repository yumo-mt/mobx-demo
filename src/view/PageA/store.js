import { observable, action,configure } from '../../mobx-source/mobx';

configure({
    useProxies: "never"
})


// var user = {
//   income: 3,
//   name: '张三'
// };
// var bankUser = observable.object(user);
// var bankUser2 = observable.box(user);

// console.log(bankUser);
// console.log(bankUser2);


var pr1 = observable.box(2);
console.log(pr1);
console.log('--------华丽分割-----------')
var pr2 = observable('ddd');
console.log(pr2);



// class Store {
//   @observable data = 'text';
// }

// export default new Store();

var parent = {
  child: {
    name: 'tony',
    age: 15
  },
  name: 'john'
}

var bankUser = observable(parent);

export default bankUser;