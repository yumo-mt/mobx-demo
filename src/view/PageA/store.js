import { observable, action } from '../../mobx-source/mobx';

class Store {
  @observable data = 'text';
}

export default new Store();
