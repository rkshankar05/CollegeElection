export default function Button({ className = "", ...props }) {
  const classes = className ? className : "";
  return <button className={classes} {...props} />;
}
