import './index.css';
function ToolTip(props: any) {
  const { innterRef, data } = props;
  const { text } = data;

  return (
    <div
      ref={innterRef}
      style={{
        position: "absolute",
        zIndex: 999,
        background: "#fff",
        width: "350px",
        height: "200px",
        padding: "10px",
        // border: "2px solid #0cc5ae",
        borderRadius: "12px",
        visibility: "hidden",
        color: "#0cc5ae",
      }}
      className='card'
    >
      {text || "this is ToolTip"}
    </div>
  );
}

export default ToolTip;
