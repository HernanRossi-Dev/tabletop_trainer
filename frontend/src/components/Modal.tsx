import { JSX } from "solid-js";
import styles from "./Modal.module.css";

type ModalProps = {
    open: boolean;
    onClose: () => void;
    children: JSX.Element;
  };

export default function Modal(props: ModalProps) {
    // ❌ Don't return null in SolidJS!
    // if (!props.open) return null;
  
    // ✅ Instead, conditionally render in the parent, or:
    return props.open ? (
      <div class={styles.overlay} onClick={props.onClose}>
        <div class={styles.modal} onClick={e => e.stopPropagation()}>
          {props.children}
            <span style={{ "margin-left": "10px" }}></span>
            <button class={styles.closeButton} onClick={props.onClose}>Close</button>
        </div>
      </div>
    ) : undefined;
  }
