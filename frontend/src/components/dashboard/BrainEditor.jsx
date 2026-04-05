export default function BrainEditor({ brain }) {
  return (
    <div>
      <h3>Brain</h3>
      <pre>{JSON.stringify(brain, null, 2)}</pre>
    </div>
  );
}
