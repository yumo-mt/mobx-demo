import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './index.css';

class PopBox extends Component {

    constructor(props) {
        super(props);
        this.state = {
            editText:'',
            isEmpty: false
        }
        this.handleSaveEdit = this.handleSaveEdit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    componentWillReceiveProps(newProps) {
        if (newProps.oldText && this.props.oldText !== newProps.oldText) {
            this.setState({
                editText: newProps.oldText
            });
        }
    }

    handleSaveEdit() {
        this.props.saveEdit(this.state.editText);
    }

    handleChange(e) {
        if (e.target.value) {
            this.setState({
                editText: e.target.value,
                isEmpty: false
            });
        } else {
            this.setState({
                editText: e.target.value,
                isEmpty: true
            });
        }
    }

    render() {
        return (
            <div className={this.props.isEdit ? styles.pActive : styles.popBox} >
                <div className={styles.popHeader}>请输入要修改的值</div>
                <div className={styles.popBody}>
                    <input value={this.state.editText} onChange={this.handleChange} />
                </div>
                <div className={styles.popFooter}>
                    <button
                        onClick={this.handleSaveEdit}
                        disabled={this.state.isEmpty ? true : false}
                        className={this.state.isEmpty ? "btnInfo b_disabled" : "btnInfo"}>
                        确认
                    </button>
                    <button onClick={this.props.hidePop}>取消</button>
                </div>
            </div>
        )
    }

}


PopBox.propTypes = {
    isEdit: PropTypes.bool.isRequired,
    oldText: PropTypes.string,
    hidePop: PropTypes.func.isRequired,
    saveEdit: PropTypes.func.isRequired
}


export default PopBox;
