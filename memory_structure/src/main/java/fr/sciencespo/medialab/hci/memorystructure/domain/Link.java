package fr.sciencespo.medialab.hci.memorystructure.domain;

/**
 *
 * @param <T>
 */
public abstract class Link<T> {

	private T source;
	private T target;
	private double weight;

	protected Link() {
		
	}
	
	public Link(T source, T target) {
		this.source = source;
		this.target = target;
	}

	public Link(T source, T target, int weight) {
		this.source = source;
		this.target = target;
        this.weight = weight;
	}
	
	public T getSource() {
		return source;
	}
	
	public T getTarget() {
		return target;
	}
	
	public void setWeight(double weight) {
		this.weight = weight;
	}
	
	public double getWeight() {
		return weight;
	}
	
	@Override
	public String toString() {
		return "source: " + source.toString() + "\ttarget: " + target.toString();
	}
	
}
