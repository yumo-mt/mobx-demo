import { observable } from '../../mobx-source/mobx';

 
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