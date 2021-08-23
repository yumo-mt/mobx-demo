import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './index.css';
 class TodoItem extends Component {

    constructor(props){
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.handelEditClick = this.handelEditClick.bind(this);
        this.handelDelClick = this.handelDelClick.bind(this);
    }

    handleClick (){
        this.props.onClick(this.props.id);
    }

    handelEditClick(){
        this.props.editClick(this.props.id,this.props.text);
    }

    handelDelClick(){
        this.props.delClick(this.props.id);
    }

    render() {
        const {completed, text} = this.props;
        return (
            <li>
                <em onClick={this.handleClick} className={completed ?  styles.selected : null}></em>
                <p onClick={this.handleClick} className={completed ? styles.completed : null} >{ text}</p>
                <i onClick={this.handelEditClick} className={completed ? styles.hide : "fa fa-pencil"} aria-hidden="true"></i>
                <span onClick={this.handelDelClick} >×</span>
            </li>
        )
    }

}

TodoItem.propTypes = {
    id: PropTypes.number.isRequired,
    text:PropTypes.any.isRequired,
    completed:PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
    delClick: PropTypes.func.isRequired,
    editClick: PropTypes.func.isRequired
}


export default TodoItem;
