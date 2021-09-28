import { configure,makeAutoObservable } from '../../mobx-source/mobx';

configure({
  enforceActions: 'always',
})
class Store{
  constructor() {
    // !!! 必写的
    makeAutoObservable(this)
  }
  job="前端"
}

export default Store;