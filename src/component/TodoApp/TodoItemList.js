import React, { Component } from 'react';
import TodoItem from './TodoItem';
import PropTypes from 'prop-types';
import styles from './index.css';

class TodoItemList extends Component {
    render() {
        const { todos, onTodoClick, editTodoClick, dleTodoClick } = this.props;
        return (
            <ul className={styles.dodoList}>
                {todos.map(todo => {
                    return (
                        <TodoItem
                            key={todo.id}
                            text={todo.text}
                            completed={todo.completed}
                            id={todo.id}
                            onClick={onTodoClick}
                            editClick={editTodoClick}
                            delClick={dleTodoClick}
                        />)
                }
                )}
            </ul>
        )
    }
}

TodoItemList.propTypes = {
    todos:PropTypes.array.isRequired,
    onTodoClick: PropTypes.func.isRequired,
    editTodoClick: PropTypes.func.isRequired,
    dleTodoClick: PropTypes.func.isRequired
}


export default TodoItemList;
